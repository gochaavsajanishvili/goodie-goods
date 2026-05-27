import { describe, expect, it } from 'vitest';

import type { FeedFilter } from './queries';

describe('FeedFilter contract', () => {
  it('requires a nullable category and a numeric limit', () => {
    const filter: FeedFilter = { category: null, limit: 30 };
    expect(filter.category).toBeNull();
    expect(filter.limit).toBe(30);
  });

  it('accepts a category string', () => {
    const filter: FeedFilter = { category: 'culture', limit: 10 };
    expect(filter.category).toBe('culture');
  });
});
