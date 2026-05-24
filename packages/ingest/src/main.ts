import { SCRAPER_CONCURRENCY } from '@goodie-goods/shared/constants';
import pLimit from 'p-limit';

import { classify } from './classify';
import { createDbClient, type DbClient } from './db';
import { fetchArticle, fetchHomepageLinks } from './fetch-ambebi';
import { shouldRejectByKeyword } from './keyword-filter';
import { findExistingUrls, persistArticle, recordIngestRun } from './persist';

import type { ParsedArticleLink, IngestSummary } from '@goodie-goods/shared/types';

interface Counters {
  keywordRejected: number;
  llmClassified: number;
  llmApproved: number;
}

async function processLink(
  db: DbClient,
  link: ParsedArticleLink,
  counters: Counters,
  errors: string[],
): Promise<void> {
  try {
    const parsed = await fetchArticle(link.url);
    if (shouldRejectByKeyword({ title: parsed.title, body: parsed.body })) {
      counters.keywordRejected += 1;
      return;
    }
    const classification = await classify({ title: parsed.title, body: parsed.body });
    counters.llmClassified += 1;
    if (classification.isGoodNews) {
      counters.llmApproved += 1;
    }
    await persistArticle(db, { parsed, classification });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(`${link.url}: ${message}`);
  }
}

export async function runIngest(): Promise<IngestSummary> {
  const startedAt = new Date();
  const db = createDbClient();
  const errors: string[] = [];
  const counters: Counters = { keywordRejected: 0, llmClassified: 0, llmApproved: 0 };

  const links = await fetchHomepageLinks();
  const existing = await findExistingUrls(
    db,
    links.map((link) => link.url),
  );
  const fresh = links.filter((link) => !existing.has(link.url));

  const limit = pLimit(SCRAPER_CONCURRENCY);
  const tasks = fresh.map(async (link) => {
    await limit(async () => {
      await processLink(db, link, counters, errors);
    });
  });
  await Promise.all(tasks);

  await recordIngestRun(db, {
    startedAt,
    finishedAt: new Date(),
    urlsSeen: links.length,
    urlsNew: fresh.length,
    ...counters,
    errorLog: errors.length === 0 ? null : { errors },
  });

  return { urlsSeen: links.length, urlsNew: fresh.length, ...counters, errors };
}

const isEntrypoint = import.meta.url === `file://${process.argv[1] ?? ''}`;
if (isEntrypoint) {
  runIngest()
    .then((summary) => {
      console.warn(`ingest done: ${JSON.stringify(summary)}`);
      process.exit(0);
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);

      console.error(`ingest failed: ${message}`);
      process.exit(1);
    });
}
