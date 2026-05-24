import { describe, expect, it } from 'vitest';

import { shouldRejectByKeyword } from './keyword-filter';

describe('shouldRejectByKeyword', () => {
  it('rejects a Georgian death keyword in the title', () => {
    const result = shouldRejectByKeyword({ title: 'მამაკაცი მოკლეს ცენტრში', body: '' });
    expect(result).toBe(true);
  });

  it('rejects a Georgian war keyword anywhere in the first 500 body chars', () => {
    const result = shouldRejectByKeyword({
      title: 'უსაფრთხო სათაური',
      body: 'სტატია იწყება ისე, რომ ომი ცენტრში მოხსენიებულია',
    });
    expect(result).toBe(true);
  });

  it('does not reject when keyword appears only after the first 500 body chars', () => {
    const padding = 'x'.repeat(500);
    const result = shouldRejectByKeyword({
      title: 'უსაფრთხო სათაური',
      body: `${padding} ომი`,
    });
    expect(result).toBe(false);
  });

  it('accepts wholesome Georgian content', () => {
    const result = shouldRejectByKeyword({
      title: 'ახალი წიგნი გამოვიდა',
      body: 'ბიბლიოთეკაში დღეს გაიხსნა საბავშვო წიგნების კუთხე',
    });
    expect(result).toBe(false);
  });

  it('rejects an English keyword in the title', () => {
    const result = shouldRejectByKeyword({ title: 'Man killed in downtown shooting', body: '' });
    expect(result).toBe(true);
  });

  it('matches English keywords case-insensitively', () => {
    const result = shouldRejectByKeyword({ title: 'WAR Continues In Eastern Region', body: '' });
    expect(result).toBe(true);
  });

  it('accepts wholesome English content', () => {
    const result = shouldRejectByKeyword({
      title: 'Local bakery opens charity branch',
      body: 'Proceeds go to community kitchen.',
    });
    expect(result).toBe(false);
  });
});
