import { z } from 'zod';

import { CATEGORIES } from './constants';

export const classificationSchema = z.object({
  isGoodNews: z.boolean(),
  score: z.number().int().min(0).max(100),
  category: z.enum(CATEGORIES),
  reason: z.string().min(1).max(500),
});

export type Classification = z.infer<typeof classificationSchema>;

export interface ParsedArticleLink {
  readonly title: string;
  readonly url: string;
}

export interface ParsedArticle {
  readonly sourceUrl: string;
  readonly title: string;
  readonly body: string;
  readonly imageUrl: string | null;
  readonly bodyImages: readonly string[];
  readonly publishedAt: Date | null;
}

export interface IngestSummary {
  readonly urlsSeen: number;
  readonly urlsNew: number;
  readonly keywordRejected: number;
  readonly llmClassified: number;
  readonly llmApproved: number;
  readonly errors: readonly string[];
}
