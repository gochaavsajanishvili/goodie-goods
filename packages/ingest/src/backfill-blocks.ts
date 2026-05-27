import { articles, type Article } from '@goodie-goods/shared/schema';
import { eq, isNull, or } from 'drizzle-orm';
import pLimit from 'p-limit';

import { isEntrypoint, runCli } from './cli';
import { createDbClient, type DbClient } from './db';
import { fetchArticle } from './fetch-ambebi';

import type { ParsedArticle } from '@goodie-goods/shared/types';

const CONCURRENCY = 4;

interface BackfillSummary {
  readonly examined: number;
  readonly updated: number;
  readonly skipped: number;
  readonly failed: number;
  readonly errors: readonly string[];
}

export async function backfillBodyBlocks(): Promise<BackfillSummary> {
  const db = createDbClient();
  const rows = await db
    .select()
    .from(articles)
    .where(or(isNull(articles.bodyBlocks), eq(articles.bodyBlocks, [])));

  const limit = pLimit(CONCURRENCY);
  const errors: string[] = [];
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  const tasks = rows.map(async (row) => {
    await limit(async () => {
      const outcome = await reparseAndUpdate(db, row);
      if (outcome.kind === 'updated') {
        updated += 1;
      } else if (outcome.kind === 'skipped') {
        skipped += 1;
      } else {
        failed += 1;
        errors.push(`${row.sourceUrl}: ${outcome.message}`);
      }
    });
  });
  await Promise.all(tasks);

  return { examined: rows.length, updated, skipped, failed, errors };
}

type Outcome = { kind: 'updated' } | { kind: 'skipped' } | { kind: 'failed'; message: string };

async function reparseAndUpdate(db: DbClient, row: Article): Promise<Outcome> {
  try {
    const parsed = await fetchArticle(row.sourceUrl);
    if (parsed.bodyBlocks.length === 0) {
      return { kind: 'skipped' };
    }
    await writeRow(db, row.id, parsed);
    return { kind: 'updated' };
  } catch (err) {
    return { kind: 'failed', message: err instanceof Error ? err.message : String(err) };
  }
}

async function writeRow(db: DbClient, id: string, parsed: ParsedArticle): Promise<void> {
  await db
    .update(articles)
    .set({
      body: parsed.body,
      bodyImages: [...parsed.bodyImages],
      bodyBlocks: [...parsed.bodyBlocks],
    })
    .where(eq(articles.id, id));
}

if (isEntrypoint(import.meta.url)) {
  runCli('backfill', backfillBodyBlocks);
}
