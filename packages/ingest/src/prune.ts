import { articles } from '@goodie-goods/shared/schema';
import { and, eq, inArray, lte, or } from 'drizzle-orm';

import type { DbClient } from './db';
import type { AdminStatus } from '@goodie-goods/shared/constants';

export interface PrunePolicy {
  readonly pendingMaxAgeDays: number;
  readonly rejectedMaxAgeDays: number;
}

export const DEFAULT_PRUNE_POLICY: PrunePolicy = {
  pendingMaxAgeDays: 7,
  rejectedMaxAgeDays: 30,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

interface PruneCandidate {
  readonly id: string;
  readonly adminStatus: AdminStatus;
  readonly createdAt: Date;
}

export function selectPruneTargets(
  rows: readonly PruneCandidate[],
  now: Date,
  policy: PrunePolicy,
): string[] {
  const pendingCutoff = now.getTime() - policy.pendingMaxAgeDays * MS_PER_DAY;
  const rejectedCutoff = now.getTime() - policy.rejectedMaxAgeDays * MS_PER_DAY;
  const targets: string[] = [];
  for (const row of rows) {
    if (isPrunable(row, pendingCutoff, rejectedCutoff)) {
      targets.push(row.id);
    }
  }
  return targets;
}

function isPrunable(row: PruneCandidate, pendingCutoff: number, rejectedCutoff: number): boolean {
  const ts = row.createdAt.getTime();
  if (row.adminStatus === 'pending') {
    return ts <= pendingCutoff;
  }
  if (row.adminStatus === 'rejected') {
    return ts <= rejectedCutoff;
  }
  return false;
}

export async function pruneOldArticles(
  db: DbClient,
  now: Date = new Date(),
  policy: PrunePolicy = DEFAULT_PRUNE_POLICY,
): Promise<number> {
  const pendingBefore = new Date(now.getTime() - policy.pendingMaxAgeDays * MS_PER_DAY);
  const rejectedBefore = new Date(now.getTime() - policy.rejectedMaxAgeDays * MS_PER_DAY);
  const candidates = await db
    .select({
      id: articles.id,
      adminStatus: articles.adminStatus,
      createdAt: articles.createdAt,
    })
    .from(articles)
    .where(
      or(
        and(eq(articles.adminStatus, 'pending'), lte(articles.createdAt, pendingBefore)),
        and(eq(articles.adminStatus, 'rejected'), lte(articles.createdAt, rejectedBefore)),
      ),
    );
  const targets = selectPruneTargets(candidates, now, policy);
  if (targets.length === 0) {
    return 0;
  }
  await db.delete(articles).where(inArray(articles.id, targets));
  return targets.length;
}
