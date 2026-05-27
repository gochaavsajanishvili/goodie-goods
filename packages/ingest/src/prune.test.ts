import { describe, expect, it } from 'vitest';

import { DEFAULT_PRUNE_POLICY, selectPruneTargets } from './prune';

import type { AdminStatus } from '@goodie-goods/shared/constants';

const NOW = new Date('2026-05-25T12:00:00Z');

function row(
  id: string,
  adminStatus: AdminStatus,
  daysOld: number,
): { id: string; adminStatus: AdminStatus; createdAt: Date } {
  const createdAt = new Date(NOW.getTime() - daysOld * 24 * 60 * 60 * 1000);
  return { id, adminStatus, createdAt };
}

describe('selectPruneTargets', () => {
  it('returns no targets when the table is empty', () => {
    const result = selectPruneTargets([], NOW, DEFAULT_PRUNE_POLICY);
    expect(result).toEqual([]);
  });

  it('never prunes approved articles, regardless of age', () => {
    const rows = [row('a', 'approved', 1), row('b', 'approved', 365), row('c', 'approved', 1000)];
    const result = selectPruneTargets(rows, NOW, DEFAULT_PRUNE_POLICY);
    expect(result).toEqual([]);
  });

  it('prunes pending rows older than the pending cutoff (default 7d)', () => {
    const rows = [row('young', 'pending', 6), row('old', 'pending', 8)];
    const result = selectPruneTargets(rows, NOW, DEFAULT_PRUNE_POLICY);
    expect(result).toEqual(['old']);
  });

  it('prunes pending rows exactly at the pending cutoff boundary', () => {
    const rows = [row('boundary', 'pending', 7)];
    const result = selectPruneTargets(rows, NOW, DEFAULT_PRUNE_POLICY);
    expect(result).toEqual(['boundary']);
  });

  it('prunes rejected rows older than the rejected cutoff (default 30d)', () => {
    const rows = [row('young', 'rejected', 29), row('old', 'rejected', 31)];
    const result = selectPruneTargets(rows, NOW, DEFAULT_PRUNE_POLICY);
    expect(result).toEqual(['old']);
  });

  it('prunes rejected rows exactly at the rejected cutoff boundary', () => {
    const rows = [row('boundary', 'rejected', 30)];
    const result = selectPruneTargets(rows, NOW, DEFAULT_PRUNE_POLICY);
    expect(result).toEqual(['boundary']);
  });

  it('keeps rejected rows younger than pending cutoff even though they are rejected', () => {
    const rows = [row('fresh', 'rejected', 3)];
    const result = selectPruneTargets(rows, NOW, DEFAULT_PRUNE_POLICY);
    expect(result).toEqual([]);
  });

  it('handles a mix of statuses and ages in one call, returning targets in input order', () => {
    const rows = [
      row('a', 'approved', 365),
      row('b', 'pending', 8),
      row('c', 'rejected', 5),
      row('d', 'rejected', 60),
      row('e', 'pending', 2),
    ];
    const result = selectPruneTargets(rows, NOW, DEFAULT_PRUNE_POLICY);
    expect(result).toEqual(['b', 'd']);
  });

  it('honors a custom policy with shorter thresholds', () => {
    const policy = { pendingMaxAgeDays: 1, rejectedMaxAgeDays: 2 };
    const rows = [
      row('a', 'pending', 2),
      row('b', 'pending', 0),
      row('c', 'rejected', 3),
      row('d', 'rejected', 1),
    ];
    const result = selectPruneTargets(rows, NOW, policy);
    expect(result).toEqual(['a', 'c']);
  });

  it('exposes the default policy with 7d pending and 30d rejected thresholds', () => {
    expect(DEFAULT_PRUNE_POLICY).toEqual({
      pendingMaxAgeDays: 7,
      rejectedMaxAgeDays: 30,
    });
  });
});
