import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { ADMIN_STATUS_VALUES, SOURCE_NAME } from './constants';

export const adminStatusEnum = pgEnum('admin_status', ADMIN_STATUS_VALUES);

export const articles = pgTable('articles', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  source: text('source').notNull().default(SOURCE_NAME),
  sourceUrl: text('source_url').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  imageUrl: text('image_url'),
  category: text('category').notNull(),
  score: integer('score').notNull(),
  isGoodNews: boolean('is_good_news').notNull(),
  reason: text('reason'),
  classifierModel: text('classifier_model').notNull(),
  classifierVersion: integer('classifier_version').notNull().default(1),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  adminStatus: adminStatusEnum('admin_status').notNull().default('pending'),
  body: text('body'),
  bodyImages: text('body_images')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
});

export const appSettings = pgTable('app_settings', {
  id: integer('id').primaryKey().default(1),
  readLocally: boolean('read_locally').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export const ingestRuns = pgTable('ingest_runs', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  urlsSeen: integer('urls_seen').notNull().default(0),
  urlsNew: integer('urls_new').notNull().default(0),
  keywordRejected: integer('keyword_rejected').notNull().default(0),
  llmClassified: integer('llm_classified').notNull().default(0),
  llmApproved: integer('llm_approved').notNull().default(0),
  errorLog: jsonb('error_log'),
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;
export type IngestRun = typeof ingestRuns.$inferSelect;
export type NewIngestRun = typeof ingestRuns.$inferInsert;
