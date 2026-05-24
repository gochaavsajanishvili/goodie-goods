import { describe, expect, it } from 'vitest';

import { deriveAdminStatus } from './persist';

describe('deriveAdminStatus', () => {
  it('rejects when classifier marks not good news, regardless of score', () => {
    expect(
      deriveAdminStatus({ isGoodNews: false, score: 99, category: 'culture', reason: '' }),
    ).toBe('rejected');
  });

  it('approves good news with strict-tier score', () => {
    expect(deriveAdminStatus({ isGoodNews: true, score: 90, category: 'family', reason: '' })).toBe(
      'approved',
    );
  });

  it('marks pending for good news in the soft tier', () => {
    expect(
      deriveAdminStatus({ isGoodNews: true, score: 60, category: 'animals', reason: '' }),
    ).toBe('pending');
  });

  it('rejects good news below the soft threshold', () => {
    expect(deriveAdminStatus({ isGoodNews: true, score: 30, category: 'other', reason: '' })).toBe(
      'rejected',
    );
  });

  it('treats the strict threshold boundary as approved', () => {
    expect(
      deriveAdminStatus({ isGoodNews: true, score: 75, category: 'culture', reason: '' }),
    ).toBe('approved');
  });

  it('treats the soft threshold boundary as pending', () => {
    expect(
      deriveAdminStatus({ isGoodNews: true, score: 50, category: 'culture', reason: '' }),
    ).toBe('pending');
  });
});
