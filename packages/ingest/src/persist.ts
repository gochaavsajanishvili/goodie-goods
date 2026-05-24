import {
  CLASSIFIER_VERSION,
  SOFT_SCORE_THRESHOLD,
  STRICT_SCORE_THRESHOLD,
} from '@goodie-goods/shared/constants';
import {
  articles,
  ingestRuns,
  type NewArticle,
  type NewIngestRun,
} from '@goodie-goods/shared/schema';
import { eq, inArray, sql } from 'drizzle-orm';

import { getActiveModel } from './classify';

import type { DbClient } from './db';
import type { AdminStatus } from '@goodie-goods/shared/constants';
import type { Classification, ParsedArticle } from '@goodie-goods/shared/types';

export async function findExistingUrls(
  db: DbClient,
  urls: readonly string[],
): Promise<Set<string>> {
  if (urls.length === 0) {
    return new Set();
  }
  const rows = await db
    .select({ sourceUrl: articles.sourceUrl })
    .from(articles)
    .where(inArray(articles.sourceUrl, [...urls]));
  return new Set(rows.map((row) => row.sourceUrl));
}

export interface PersistArticleInput {
  readonly parsed: ParsedArticle;
  readonly classification: Classification;
}

export async function persistArticle(db: DbClient, input: PersistArticleInput): Promise<void> {
  const { parsed, classification } = input;
  const adminStatus = deriveAdminStatus(classification);
  const excerpt = parsed.body.slice(0, 280);

  const row: NewArticle = {
    sourceUrl: parsed.sourceUrl,
    title: parsed.title,
    excerpt,
    imageUrl: parsed.imageUrl,
    category: classification.category,
    score: classification.score,
    isGoodNews: classification.isGoodNews,
    reason: classification.reason,
    classifierModel: getActiveModel(),
    classifierVersion: CLASSIFIER_VERSION,
    publishedAt: parsed.publishedAt,
    adminStatus,
    body: parsed.body,
    bodyImages: [...parsed.bodyImages],
  };

  await db
    .insert(articles)
    .values(row)
    .onConflictDoUpdate({
      target: articles.sourceUrl,
      set: {
        title: sql`excluded.title`,
        excerpt: sql`excluded.excerpt`,
        imageUrl: sql`excluded.image_url`,
        category: sql`excluded.category`,
        score: sql`excluded.score`,
        isGoodNews: sql`excluded.is_good_news`,
        reason: sql`excluded.reason`,
        classifierModel: sql`excluded.classifier_model`,
        classifierVersion: sql`excluded.classifier_version`,
        publishedAt: sql`excluded.published_at`,
        body: sql`excluded.body`,
        bodyImages: sql`excluded.body_images`,
      },
      setWhere: eq(articles.adminStatus, 'pending'),
    });
}

export function deriveAdminStatus(classification: Classification): AdminStatus {
  if (!classification.isGoodNews) {
    return 'rejected';
  }
  if (classification.score >= STRICT_SCORE_THRESHOLD) {
    return 'approved';
  }
  if (classification.score >= SOFT_SCORE_THRESHOLD) {
    return 'pending';
  }
  return 'rejected';
}

export async function recordIngestRun(db: DbClient, run: NewIngestRun): Promise<void> {
  await db.insert(ingestRuns).values(run);
}
