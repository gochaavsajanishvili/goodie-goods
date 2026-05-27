/**
 * Inject soft hyphens (U+00AD) into Georgian Mkhedruli text at syllable
 * boundaries. CSS `hyphens: auto` honors soft hyphens in every browser
 * regardless of whether the user agent ships a Georgian hyphenation
 * dictionary, so this gives consistent justified Georgian everywhere.
 */

const VOWELS = new Set(['ა', 'ე', 'ი', 'ო', 'უ']);
const MKHEDRULI_RUN = /[ა-ჺ]{4,}/gu;
const MIN_LEADING = 2;
const MIN_TRAILING = 1;
const SOFT_HYPHEN = '­';

const SEGMENTER = new Intl.Segmenter('ka', { granularity: 'grapheme' });

function graphemes(word: string): string[] {
  return [...SEGMENTER.segment(word)].map((s) => s.segment);
}

function canBreakAfter(chars: readonly string[], index: number): boolean {
  const current = chars[index];
  const next = chars[index + 1];
  if (current === undefined || next === undefined) {
    return false;
  }
  if (!VOWELS.has(current)) {
    return false;
  }
  if (VOWELS.has(next)) {
    return false;
  }
  if (index < MIN_LEADING) {
    return false;
  }
  if (chars.length - index - 1 <= MIN_TRAILING) {
    return false;
  }
  return true;
}

function hyphenateRun(run: string): string {
  const chars = graphemes(run);
  const out: string[] = [];
  for (let i = 0; i < chars.length; i += 1) {
    out.push(chars[i] ?? '');
    if (canBreakAfter(chars, i)) {
      out.push(SOFT_HYPHEN);
    }
  }
  return out.join('');
}

export function hyphenateGeorgian(text: string): string {
  return text.replace(MKHEDRULI_RUN, (run) => hyphenateRun(run));
}

export function hyphenateGeorgianHtml(html: string): string {
  return html
    .split(/(<[^>]+>)/u)
    .map((part) => (part.startsWith('<') ? part : hyphenateGeorgian(part)))
    .join('');
}
