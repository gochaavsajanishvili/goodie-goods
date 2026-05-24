import { describe, expect, it } from 'vitest';

import type { FeedMode } from './queries';

describe('FeedMode contract', () => {
  it('accepts the two supported feed modes', () => {
    const modes: FeedMode[] = ['strict', 'soft'];
    expect(modes).toHaveLength(2);
  });

  it('treats strict as the stricter mode label', () => {
    const mode: FeedMode = 'strict';
    expect(mode).toBe('strict');
  });
});
