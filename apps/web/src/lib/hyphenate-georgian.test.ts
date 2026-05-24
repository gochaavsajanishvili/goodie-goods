import { describe, expect, it } from 'vitest';

import { hyphenateGeorgian } from './hyphenate-georgian';

const SHY = '­';

describe('hyphenateGeorgian', () => {
  it('leaves short words alone', () => {
    expect(hyphenateGeorgian('კი არა')).toBe('კი არა');
  });

  it('does not touch Latin words', () => {
    expect(hyphenateGeorgian('ambebi.ge')).toBe('ambebi.ge');
  });

  it('inserts soft hyphens after vowels before consonants in long words', () => {
    const word = 'მეცნიერებმა';
    const result = hyphenateGeorgian(word);
    expect(result).toContain(SHY);
    expect(result.length).toBeGreaterThan(word.length);
  });

  it('keeps minimum two chars at start and end', () => {
    const word = 'მზე';
    expect(hyphenateGeorgian(word)).toBe(word);
  });

  it('does not hyphenate at vowel-vowel boundary', () => {
    const word = 'ოოოოო';
    const result = hyphenateGeorgian(word);
    expect(result).toBe(word);
  });

  it('preserves whitespace between words', () => {
    const sentence = 'მეცნიერებმა გადაცილებული ადამიანების';
    const result = hyphenateGeorgian(sentence);
    expect(result.split(/\s+/u).length).toBe(3);
  });

  it('produces fewer hyphens than total vowels in a word with edges respected', () => {
    const word = 'მონაცემები';
    const segmenter = new Intl.Segmenter('ka', { granularity: 'grapheme' });
    const vowels = [...segmenter.segment(word)].filter((s) => 'აეიოუ'.includes(s.segment)).length;
    const hyphenCount = (hyphenateGeorgian(word).match(/­/gu) ?? []).length;
    expect(hyphenCount).toBeGreaterThan(0);
    expect(hyphenCount).toBeLessThanOrEqual(vowels);
  });
});
