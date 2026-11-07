import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const articles = pgTable(
  'articles',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    standfirst: text('standfirst'),
    body: text('body').notNull(),
    leadImage: text('lead_image'),
    category: text('category').notNull(),
    department: text('department'),
    nature: text('nature').notNull(),
    status: text('status').notNull(),
    featured: integer('featured').notNull().default(0),
    weekNumber: integer('week_number'),
    weekStart: text('week_start'),
    weekEnd: text('week_end'),
    sources: text('sources'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    publishedAt: text('published_at'),
    archivedAt: text('archived_at'),
    deletedAt: text('deleted_at'),
  },
  (table) => [
    check('articles_status_check', sql`${table.status} in ('draft', 'published', 'archived')`),
    check('articles_nature_check', sql`${table.nature} in ('info', 'analyse', 'opinion')`),
    index('articles_status_published_idx').on(table.status, table.publishedAt),
    index('articles_updated_at_idx').on(table.updatedAt),
  ],
);

export const articleRevisions = pgTable(
  'article_revisions',
  {
    id: text('id').primaryKey(),
    articleId: text('article_id')
      .notNull()
      .references(() => articles.id, { onDelete: 'cascade' }),
    revisionNumber: integer('revision_number').notNull(),
    snapshot: text('snapshot').notNull(),
    summary: text('summary'),
    author: text('author'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('article_revisions_article_idx').on(table.articleId, table.revisionNumber),
    uniqueIndex('article_revisions_number_idx').on(table.articleId, table.revisionNumber),
  ],
);

export const media = pgTable('media', {
  id: text('id').primaryKey(),
  url: text('url').notNull(),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  width: integer('width'),
  height: integer('height'),
  size: integer('size'),
  altText: text('alt_text').notNull(),
  credit: text('credit').notNull(),
  createdAt: text('created_at').notNull(),
});

export const suggestions = pgTable(
  'suggestions',
  {
    id: text('id').primaryKey(),
    text: text('text').notNull(),
    category: text('category').notNull(),
    department: text('department'),
    status: text('status').notNull().default('pending'),
    flagged: integer('flagged').notNull().default(0),
    flagReason: text('flag_reason'),
    votesUseful: integer('votes_useful').notNull().default(0),
    votesNotUseful: integer('votes_not_useful').notNull().default(0),
    reportCount: integer('report_count').notNull().default(0),
    duplicateOf: text('duplicate_of'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    publishedAt: text('published_at'),
    archivedAt: text('archived_at'),
  },
  (table) => [
    check(
      'suggestions_text_length_check',
      sql`char_length(${table.text}) between 20 and 600`,
    ),
    check(
      'suggestions_status_check',
      sql`${table.status} in ('pending', 'discussion', 'retained', 'adapted', 'integrated', 'archived', 'expired', 'hidden')`,
    ),
    index('suggestions_status_created_idx').on(table.status, table.createdAt),
    index('suggestions_created_at_idx').on(table.createdAt),
  ],
);

export const suggestionVotes = pgTable(
  'suggestion_votes',
  {
    id: text('id').primaryKey(),
    suggestionId: text('suggestion_id')
      .notNull()
      .references(() => suggestions.id, { onDelete: 'cascade' }),
    voterHash: text('voter_hash').notNull(),
    value: text('value').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    uniqueIndex('suggestion_votes_unique_idx').on(table.suggestionId, table.voterHash),
    check('suggestion_votes_value_check', sql`${table.value} in ('useful', 'not_useful')`),
    index('suggestion_votes_suggestion_value_idx').on(table.suggestionId, table.value),
  ],
);

export const suggestionResponses = pgTable(
  'suggestion_responses',
  {
    id: text('id').primaryKey(),
    suggestionId: text('suggestion_id')
      .notNull()
      .references(() => suggestions.id, { onDelete: 'cascade' }),
    responseText: text('response_text').notNull(),
    responderRole: text('responder_role').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('suggestion_responses_suggestion_idx').on(table.suggestionId, table.createdAt),
  ],
);

export const reports = pgTable(
  'reports',
  {
    id: text('id').primaryKey(),
    suggestionId: text('suggestion_id')
      .notNull()
      .references(() => suggestions.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [
    index('reports_suggestion_idx').on(table.suggestionId),
    index('reports_created_at_idx').on(table.createdAt),
  ],
);

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const roadmap = pgTable(
  'roadmap',
  {
    id: text('id').primaryKey(),
    stepOrder: integer('step_order').notNull(),
    title: text('title').notNull(),
    status: text('status').notNull(),
    description: text('description'),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('roadmap_order_idx').on(table.stepOrder)],
);

export const studioUsers = pgTable('studio_users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  passhash: text('passhash').notNull(),
  role: text('role').notNull(),
  createdAt: text('created_at').notNull(),
});

export const auditLog = pgTable(
  'audit_log',
  {
    id: text('id').primaryKey(),
    action: text('action').notNull(),
    target: text('target').notNull(),
    details: text('details'),
    userRole: text('user_role').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('audit_log_created_at_idx').on(table.createdAt)],
);

export const members = pgTable(
  'members',
  {
    id: text('id').primaryKey(),
    memberNumber: text('member_number').notNull().unique(),
    fullName: text('full_name').notNull(),
    email: text('email').notNull(),
    department: text('department'),
    status: text('status').notNull().default('dossier_recu'),
    createdAt: text('created_at').notNull(),
    cardSentAt: text('card_sent_at'),
  },
  (table) => [index('members_created_at_idx').on(table.createdAt)],
);

export const backupLog = pgTable(
  'backup_log',
  {
    id: text('id').primaryKey(),
    createdAt: text('created_at').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    sha256: text('sha256').notNull(),
    rowCounts: text('row_counts').notNull(),
    destination: text('destination'),
  },
  (table) => [index('backup_log_created_at_idx').on(table.createdAt)],
);

export const snapshotMeta = pgTable(
  'snapshot_meta',
  {
    id: integer('id').primaryKey(),
    builtAt: text('built_at').notNull(),
    etag: text('etag').notNull(),
  },
  (table) => [check('snapshot_meta_single_row_check', sql`${table.id} = 1`)],
);
