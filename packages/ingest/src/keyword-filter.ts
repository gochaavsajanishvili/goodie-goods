import { NEGATIVE_KEYWORDS_EN, NEGATIVE_KEYWORDS_KA } from '@goodie-goods/shared/constants';

const BODY_SCAN_LENGTH = 500;

export interface KeywordScanInput {
  readonly title: string;
  readonly body: string;
}

export function shouldRejectByKeyword({ title, body }: KeywordScanInput): boolean {
  const haystack = `${title}\n${body.slice(0, BODY_SCAN_LENGTH)}`;

  for (const keyword of NEGATIVE_KEYWORDS_KA) {
    if (haystack.includes(keyword)) {
      return true;
    }
  }

  const haystackLower = haystack.toLowerCase();
  for (const keyword of NEGATIVE_KEYWORDS_EN) {
    if (haystackLower.includes(keyword)) {
      return true;
    }
  }

  return false;
}
