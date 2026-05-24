import { describe, expect, it } from 'vitest';

import { CATEGORIES } from './constants';
import { classificationSchema } from './types';

describe('classificationSchema', () => {
  it('accepts a well-formed classification', () => {
    const result = classificationSchema.safeParse({
      isGoodNews: true,
      score: 80,
      category: 'family',
      reason: 'სასიამოვნო ისტორია ოჯახზე.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects score below 0', () => {
    const result = classificationSchema.safeParse({
      isGoodNews: true,
      score: -1,
      category: 'family',
      reason: 'reason',
    });
    expect(result.success).toBe(false);
  });

  it('rejects score above 100', () => {
    const result = classificationSchema.safeParse({
      isGoodNews: true,
      score: 101,
      category: 'family',
      reason: 'reason',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer scores', () => {
    const result = classificationSchema.safeParse({
      isGoodNews: true,
      score: 80.5,
      category: 'family',
      reason: 'reason',
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown categories', () => {
    const result = classificationSchema.safeParse({
      isGoodNews: true,
      score: 80,
      category: 'politics',
      reason: 'reason',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty reason', () => {
    const result = classificationSchema.safeParse({
      isGoodNews: true,
      score: 80,
      category: 'family',
      reason: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects reason longer than 500 chars', () => {
    const result = classificationSchema.safeParse({
      isGoodNews: true,
      score: 80,
      category: 'family',
      reason: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('accepts every category in the shared list', () => {
    for (const category of CATEGORIES) {
      const result = classificationSchema.safeParse({
        isGoodNews: true,
        score: 50,
        category,
        reason: 'ok',
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects when isGoodNews is missing', () => {
    const result = classificationSchema.safeParse({
      score: 80,
      category: 'family',
      reason: 'reason',
    });
    expect(result.success).toBe(false);
  });
});
