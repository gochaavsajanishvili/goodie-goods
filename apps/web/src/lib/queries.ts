import 'server-only';

import { appSettings, articles, type Article } from '@goodie-goods/shared/schema';
import { and, desc, eq, ne, type SQL } from 'drizzle-orm';

import { getDb } from './db';

export interface FeedFilter {
  readonly category: string | null;
  readonly limit: number;
}

function publicFeedConditions(): SQL[] {
  return [eq(articles.adminStatus, 'approved'), eq(articles.isGoodNews, true)];
}

async function selectArticlesByDate(
  conditions: readonly SQL[],
  limit: number,
): Promise<readonly Article[]> {
  const db = getDb();
  return await db
    .select()
    .from(articles)
    .where(and(...conditions))
    .orderBy(desc(articles.createdAt))
    .limit(limit);
}

export async function getApprovedArticles(filter: FeedFilter): Promise<readonly Article[]> {
  const conditions: SQL[] = [...publicFeedConditions()];
  if (filter.category !== null) {
    conditions.push(eq(articles.category, filter.category));
  }
  return await selectArticlesByDate(conditions, filter.limit);
}

export async function getPendingArticles(limit: number): Promise<readonly Article[]> {
  return await selectArticlesByDate([eq(articles.adminStatus, 'pending')], limit);
}

export async function getApprovedArticleById(id: string): Promise<Article | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(articles)
    .where(and(eq(articles.id, id), eq(articles.adminStatus, 'approved')))
    .limit(1);
  return row ?? null;
}

export async function getRelatedArticles(
  excludeId: string,
  category: string,
  limit: number,
): Promise<readonly Article[]> {
  const sameCategory = await selectArticlesByDate(
    [...publicFeedConditions(), ne(articles.id, excludeId), eq(articles.category, category)],
    limit,
  );
  if (sameCategory.length >= limit) {
    return sameCategory;
  }
  const seen = new Set(sameCategory.map((a) => a.id));
  seen.add(excludeId);
  const fallback = await selectArticlesByDate(
    [...publicFeedConditions(), ne(articles.id, excludeId)],
    limit * 2,
  );
  const filler = fallback.filter((a) => !seen.has(a.id)).slice(0, limit - sameCategory.length);
  return [...sameCategory, ...filler];
}

export async function getReadLocallySetting(): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ readLocally: appSettings.readLocally })
    .from(appSettings)
    .where(eq(appSettings.id, 1))
    .limit(1);
  return row?.readLocally ?? true;
}

export async function toggleReadLocally(): Promise<boolean> {
  const db = getDb();
  const current = await getReadLocallySetting();
  const next = !current;
  await db
    .insert(appSettings)
    .values({ id: 1, readLocally: next, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: { readLocally: next, updatedAt: new Date() },
    });
  return next;
}
